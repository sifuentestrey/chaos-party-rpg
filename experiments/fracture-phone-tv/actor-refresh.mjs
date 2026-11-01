/** Bounded native actor polling: one outstanding request per authenticated session.
 * Socket.IO's timeout callback is expected, but a missed callback must not
 * strand the session or allow a late response to overwrite newer state.
 */
export function beginActorRefresh(session,now=Date.now()){
 if(!session?.socket?.connected||!session.actor||session.player?.parked)return null;
 if(session.refreshTicket&&session.refreshTicket.deadline>now)return null;
 const ticket={epoch:session.epoch,seq:(session.refreshSeq||0)+1,deadline:now+2000};
 session.refreshSeq=ticket.seq;
 session.refreshTicket=ticket;
 return ticket;
}
export function finishActorRefresh(session,ticket){
 if(!ticket||session?.refreshTicket!==ticket)return false;
 session.refreshTicket=null;
 return session.epoch===ticket.epoch&&!!session.socket?.connected&&!!session.actor&&!session.player?.parked;
}
export function invalidateActorRefresh(session){
 session.refreshTicket=null;
}
