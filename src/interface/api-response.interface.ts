// src/interfaces/api-response.interface.ts

/**
 * Generic API Response Interface
 * Digunakan untuk memberikan response format yang konsisten
 * di seluruh aplikasi
 */
export interface ApiResponse<T = any> {
    /**
     * Status keberhasilan request
     * true jika berhasil, false jika gagal
     */
    success: boolean;
  
    /**
     * Pesan response yang menjelaskan hasil operasi
     * Berisi informasi yang user-friendly
     */
    message: string;
  
    /**
     * Data hasil operasi (optional)
     * Berisi data yang dikembalikan jika ada
     */
    data?: T;
  
    /**
     * Error details (optional)
     * Berisi detail error jika terjadi kesalahan
     */
    error?: {
      code?: string;
      details?: any;
    };
  
    /**
     * Metadata tambahan (optional)
     * Berisi informasi tambahan seperti pagination, count, etc.
     */
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      timestamp?: Date;
      [key: string]: any;
    };
  }
  
  /**
   * Specialized interface untuk response dengan pagination
   */
  export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      timestamp: Date;
    };
  }
  
  /**
   * Helper function untuk membuat success response
   */
  export function createSuccessResponse<T>(
    message: string,
    data?: T,
    meta?: any
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        ...meta,
        timestamp: new Date()
      }
    };
  }
  
  /**
   * Helper function untuk membuat error response
   */
  export function createErrorResponse(
    message: string,
    error?: { code?: string; details?: any }
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      error,
      meta: {
        timestamp: new Date()
      }
    };
  }