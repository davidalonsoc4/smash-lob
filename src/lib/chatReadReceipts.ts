/**
 * Every read used to be announced to the whole thread, so one message cost N announcements
 * answered by N clients each (N² realtime events). Receipts only need to look live, so a read is
 * announced when `pendingReaders` (active members still behind after it) is a multiple of this number.
 * The last reader (0 pending) always announces, so the final state is always broadcast.
 */
export const READ_RECEIPT_BROADCAST_EVERY = 4

export function shouldAnnounceRead(pendingReaders: number) {
  return pendingReaders % READ_RECEIPT_BROADCAST_EVERY === 0
}
