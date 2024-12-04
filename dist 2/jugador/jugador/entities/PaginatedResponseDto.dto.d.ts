export declare class PaginatedResponseDto<T> {
    players: T[];
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    constructor(players: T[], total: number, currentPage: number, totalPages: number, limit: number);
}
