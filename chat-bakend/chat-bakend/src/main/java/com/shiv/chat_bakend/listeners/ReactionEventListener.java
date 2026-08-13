package com.shiv.chat_bakend.listeners;

import com.shiv.chat_bakend.evenentPayloads.ReactionEvent;
import com.shiv.chat_bakend.service.NotificationServ;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@NoArgsConstructor
public class ReactionEventListener {

    @Autowired
    private NotificationServ notificationServ;

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleReaction(ReactionEvent reactionEvent){
        notificationServ.notifyReaction(
                reactionEvent.getReactionResponseDto(),
                reactionEvent.getCurrentUserID()
        );
    }
}
