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
        const user = await this.userRepository.findOne({ where: { rut: rut } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }
        const authEntry = await this.authRepository.findOne({where:{ idUser: user.id }});
        if (!authEntry) {
            throw new BadRequestException ("Llame a soporte, se viene serio mi chamo!");
        }
        await this.userRepository.remove(user);
        await this.authRepository.remove(authEntry);
        return true;
    }

    async updateUser(rut: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con rut ${rut} no encontrado`);
        }
        const emailCheck = await this.userRepository.findOne({where: {email: updateUserDto.email}});
        if(emailCheck){
            throw new BadRequestException("El email ingresado ya esta en uso!");
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


    async findByRut(rut: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con RUT ${rut} no encontrado`);
        }
        return user;
    }

    async getAllUser(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async getAllStudents(): Promise<UserEntity[]> {
        return await this.userRepository.find({
            where: { role: UserRoles.Student },
        });
    }

    async updatePassword(id: number, newPassword: string): Promise<void> {
        await this.authRepository.update(id, { password: newPassword });
    }

    async updateChangePass(id: number, newIsChangePass: boolean): Promise<void>{
        await this.authRepository.update(id, {isChangePass: newIsChangePass});
    }

    async sendCredentialsEmail(email:string, password:string){
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'marcapp.service@gmail.com',
            pass: 'REDACTED'
        }
    });

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
    await transporter.sendMail(mailOptions);
    }

    async findUserById(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'firstName', 'lastName', 'rut', 'email', 'role'],
        });
        if (!user) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        return user;
    }

    async findOneByEmail(email: string) {
        return await this.userRepository.findOneBy({ email });
    }
}
