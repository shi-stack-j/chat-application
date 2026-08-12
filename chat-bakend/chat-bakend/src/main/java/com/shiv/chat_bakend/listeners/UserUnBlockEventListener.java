package com.shiv.chat_bakend.listeners;

import com.shiv.chat_bakend.evenentPayloads.UserUnBlockEvent;
import com.shiv.chat_bakend.service.NotificationServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class UserUnBlockEventListener {
    @Autowired
    private NotificationServ notificationServ;
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void unBlockEventHandle(UserUnBlockEvent unBlockEvent){
        System.out.println("Calling the application unblock event handler ");
        notificationServ.notifyOnline(unBlockEvent.getBlockedId(), unBlockEvent.getBlockerId());
    }
}
