export interface UpdateStatusBooking {
    updateId: number;
    bookingId: number;
    statusLama: string;
    statusBaru: string;
    updatedByUserId?: number;
    updatedByAdminId?: number;
    keterangan?: string;
    timestampUpdate: Date;
    createdAt: Date;
  }