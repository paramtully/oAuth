
// represents an interface for hashing strings
export default interface Hash {
    hash(subject: string): string;
    isMatch(subject: string, hashed: string): boolean;
    getSalt(hashed: string): string;
}