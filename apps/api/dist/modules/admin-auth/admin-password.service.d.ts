export declare class AdminPasswordService {
    hash(password: string): Promise<string>;
    verify(hash: string | null | undefined, password: string): Promise<boolean>;
}
