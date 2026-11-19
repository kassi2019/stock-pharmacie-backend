export declare class CreerFournisseurDto {
    code?: string | null;
    nom: string;
    contact?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    actif?: boolean;
}
declare const ModifierFournisseurDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreerFournisseurDto>>;
export declare class ModifierFournisseurDto extends ModifierFournisseurDto_base {
}
export {};
