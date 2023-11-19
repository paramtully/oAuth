import DB from './DB';
import DataEntry from "./resources/DataEntry";
import * as fs from "fs-extra";
import AlreadyExistsError from "./errors/AlreadyExistsError";
import NotFoundError from "./errors/NotFoundError";
const isValidFilename = require("fix-esm").require("valid-filename").default;

// database implemented as a json file
export default class FileDB implements DB {
    public readonly filename: string;
    private readonly BASE_PATH = "./persist/";
    private static DEFAULT_FILE_NAME = "data.json"
    private readonly BACKUP_FILE_NAME = "backup.json";

    constructor(filename: string = FileDB.DEFAULT_FILE_NAME) {
        if (this.isValidFileName(filename)) this.filename = filename;
        else this.filename = FileDB.DEFAULT_FILE_NAME;
        this.ensureDB(this.getPath());
    }

    private isValidFileName(filename: string): boolean {
        return (
            isValidFilename(filename) &&
            filename.includes(".json") &&
            filename.toLowerCase() !== this.BACKUP_FILE_NAME
        );
    }

    private getPath(): string {
        return this.BASE_PATH + this.filename;
    }

    private getBackupPath(): string {
        return this.BASE_PATH + this.BACKUP_FILE_NAME;
}

    // ensures database at path is initialized and valid
    private ensureDB(path: string): void {
        if (!fs.existsSync(path) || fs.readFileSync(path, 'utf-8') === '') {
            this.write([]);
        }
    }

    // reads user table from file
    private read(): DataEntry[] {
        fs.ensureFileSync(this.getPath());
        return fs.readJSONSync(this.getPath());
    }

    // writes user table back into db file
    private write(dataEntries: DataEntry[]): void {
        fs.ensureFileSync(this.getPath());
        fs.writeJSONSync(this.getPath(), dataEntries);
    }

    // removes a user if the user exists
    public deleteUser(email: string): void {
        const dataEntries: DataEntry[] = this.read();
        const result: DataEntry[] = dataEntries.filter((de) => de.email != email);
        this.write(result);
    }

    // adds a user to the db if they don't already exist
    public addUser(dataEntry: DataEntry): void {
        const result: DataEntry[] = this.read();
        const emails: Set<string> = new Set<string>();
        result.forEach((e) => emails.add(e.email));
        if (emails.has(dataEntry.email)) throw new AlreadyExistsError();
        result.push(dataEntry);
        this.write(result);
    }

    // updates an existing user in the db
    public updateUser(dataEntry: DataEntry): void {
        const result: DataEntry[] = this.read();
        const userIndex: number = result.findIndex((de) => de.email === dataEntry.email);
        if (userIndex < 0) throw new NotFoundError();
        result[userIndex] = {...dataEntry};
        this.write(result);
    }

    // gets a single user in the database
    public getUser(email: string): DataEntry {
        const dataEntries: DataEntry[] = this.read();
        const user: DataEntry | undefined = dataEntries?.find((de) => de.email === email);
        if (!user) throw new NotFoundError();
        return user;
    }

    // resets contents of DB and saves a backup in a separate database file
    public resetDB(): void {
        this.ensureDB(this.getPath());
        fs.ensureFileSync(this.getBackupPath());
        fs.writeJSONSync(this.getBackupPath(), fs.readJSONSync(this.getPath()));
        this.write([]);
    }

    // restores previously deleted database and saves current database in backup file
    public restoreDB(): void {
        this.ensureDB(this.getBackupPath());
        fs.ensureFileSync(this.getPath());
        const currentDB: DataEntry[] = fs.readJSONSync(this.getPath());
        fs.writeJSONSync(this.getPath(), fs.readJSONSync(this.getBackupPath()));
        fs.writeJSONSync(this.getBackupPath(), currentDB);
    }

}