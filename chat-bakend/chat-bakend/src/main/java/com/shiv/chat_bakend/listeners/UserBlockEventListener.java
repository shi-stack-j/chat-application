package com.shiv.chat_bakend.listeners;


import com.shiv.chat_bakend.evenentPayloads.UserBlockedEvent;
import com.shiv.chat_bakend.service.NotificationServ;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@NoArgsConstructor
public class UserBlockEventListener {

    @Autowired
    private NotificationServ notificationServ;

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void userBlockEvent(UserBlockedEvent userBlockedEvent){
        System.out.println("Calling the block event handler");
        notificationServ.notifyOffline(
                userBlockedEvent.getBlockedId(),
                userBlockedEvent.getBlockerId()
        );
    }

}
