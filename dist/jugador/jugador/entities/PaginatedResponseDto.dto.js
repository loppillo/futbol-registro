"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedResponseDto = void 0;
class PaginatedResponseDto {
    constructor(players, total, currentPage, totalPages, limit) {
        this.players = players;
        this.total = total;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.limit = limit;
    }
}
exports.PaginatedResponseDto = PaginatedResponseDto;
//# sourceMappingURL=PaginatedResponseDto.dto.js.map