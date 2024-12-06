import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { UserRoles } from "./enums/user-roles.enums";
import { AuthEntity } from "src/auth/entity/auth.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as nodemailer from 'nodemailer';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    async addNewUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { role, password, ...userData } = createUserDto;
        if (!role) {
            throw new BadRequestException('El campo role es obligatorio');
        }

        const rut = createUserDto.rut
        const email = createUserDto.email

        const existingUserByRut = await this.userRepository.findOne({ where: { rut } });
        if (existingUserByRut) {
            throw new BadRequestException(`El RUT ${rut} ya está registrado en el sistema.`);
        }

        const existingUserByEmail = await this.userRepository.findOne({ where: { email } });
        if (existingUserByEmail) {
            throw new BadRequestException(`El email ${email} ya está registrado en el sistema.`);
        }
        
        const newUser = this.userRepository.create({
            ...userData,
            role,
        });
        const savedUser = await this.userRepository.save(newUser);
        
        if (role === UserRoles.Teacher || role === UserRoles.Admin || role === UserRoles.Parents) {
            if (!password) {
                throw new BadRequestException('Se requiere una contraseña para roles Teacher, Admin o Parent');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const authEntity = this.authRepository.create({
                idUser: savedUser.id,
                password: hashedPassword,
                isChangePass: true
            });
            await this.authRepository.save(authEntity);
            await this.sendCredentialsEmail(email, password);
        }
        return savedUser;
    }

    async deleteUser(rut: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }
        await this.userRepository.remove(user);
        return true;
    }

    async updateUser(rut: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con rut ${rut} no encontrado`);
        }
        if (updateUserDto.firstName) {
            user.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
            user.lastName = updateUserDto.lastName;
        }
        if (updateUserDto.email) {
            user.email = updateUserDto.email;
        }
        return await this.userRepository.save(user);
    }

    // Método para buscar un usuario por su RUT
    async findByRut(rut: string): Promise<UserEntity> {
        // Busca al usuario por su RUT
        const user = await this.userRepository.findOne({ where: { rut } });
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new BadRequestException(`Usuario con RUT ${rut} no encontrado`);
        }
        // Devuelve el usuario encontrado
        return user;
    }

    // Método para buscar un usuario por su ID
    async findUserById(id: number): Promise<UserEntity> {
        // Busca al usuario por su ID y selecciona solo los campos relevantes
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'firstName', 'lastName', 'rut', 'email', 'role'],
        });
        
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }

        // Devuelve el usuario encontrado
        return user;
    }

    // Método para buscar un usuario por su email
    async findOneByEmail(email: string) {
        // Busca y devuelve el usuario que coincide con el email proporcionado
        return await this.userRepository.findOneBy({ email });
    }

    // Método para obtener todos los usuarios
    async getAllUser(): Promise<UserEntity[]> {
        // Devuelve una lista de todos los usuarios en la base de datos
        return await this.userRepository.find();
    }

    // Método para obtener todos los usuarios con el rol de estudiante
    async getAllStudents(): Promise<UserEntity[]> {
        // Devuelve una lista de todos los usuarios cuyo rol es 'Student'
        return await this.userRepository.find({
            where: { role: UserRoles.Student },
        });
    }

    // Método para actualizar la contraseña de un usuario dado su ID
    async updatePassword(id: number, newPassword: string): Promise<void> {
        // Actualiza la contraseña del usuario en el repositorio de autenticación
        await this.authRepository.update(id, { password: newPassword });
    }

    async updateChangePass(id: number, newIsChangePass: boolean): Promise<void>{
        await this.authRepository.update(id, {isChangePass: newIsChangePass});
    }




    async sendCredentialsEmail(email:string, password:string){
        // Configura el transportador de correo usando Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'marcapp.service@gmail.com',
            pass: 'REDACTED'
        }
    });

    // Define las opciones del correo electrónico
    const mailOptions = {
        from: '"MarcApp" <marcapp.service@gmail.com>',
        to: email,
        subject: 'Credenciales de acceso a MarcApp',
        text: `Hola,\n\nTus credenciales de acceso a MarcApp son:\n\nUsuario: ${email}\nContraseña: ${password}\n\nTe recomendamos cambiar tu contraseña después de iniciar sesión.\n\nSaludos,\nEquipo de MarcApp`,
        html: `
            <html>
                <body>
                    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333;">
                        <h2>Hola,</h2>
                        <p>Tus credenciales de acceso a <strong>MarcApp</strong> son:</p>
                        <p style="font-size: 18px; color: #555;">
                            <strong>Usuario:</strong> ${email}<br><br>
                            <strong>Contraseña:</strong> <span style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 4px; font-weight: bold;">${password}</span>
                        </p>
                        <p>Te recomendamos cambiar esta contraseña por una propia tan pronto como inicies sesión.</p>
                        <p>Si tienes alguna consulta, no dudes en contactarnos.</p>
                        <footer>
                            <p>Saludos cordiales,</p>
                            <p>Equipo de <strong>MarcApp</strong></p>
                        </footer>
                    </div>
                </body>
            </html>
        `
    };

    // Envía el correo electrónico
    await transporter.sendMail(mailOptions);
    }
}
