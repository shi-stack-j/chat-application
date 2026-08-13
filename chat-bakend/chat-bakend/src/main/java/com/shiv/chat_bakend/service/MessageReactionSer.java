package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.reaction.MessageReactionReqDto;
import com.shiv.chat_bakend.dto.reaction.MessageReactionResponseDto;
import com.shiv.chat_bakend.enums.ReactionActionEnum;
import com.shiv.chat_bakend.evenentPayloads.ReactionEvent;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.MessageReactionEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.projection.MessageReactionVisibilityProjection;
import com.shiv.chat_bakend.repository.*;
import com.shiv.chat_bakend.validation.EmojiValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MessageReactionSer {
    @Autowired
    private MessageReactionRepo reactionRepo;
    @Autowired
    private CurrentUserSer currentUserSer;
    @Autowired
    private MessageRepo messageRepo;
    @Autowired
    private MessageVisibilityRepo messageVisibilityRepo;
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private EmojiValidator emojiValidator;
    @Autowired
    private UserRep userRep;
    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public ResponseEntity<?> addOrUpdateReaction(MessageReactionReqDto reactionReqDto) {
        if (reactionReqDto == null) return ResponseEntity.badRequest().body("Reaction request is not valid");
//        This is used to validate for the emoji
        emojiValidator.validate(reactionReqDto.getEmoji());
        String currentUserId= currentUserSer.getUserId();
//        Here we are fetching the current user
        UserEn currentUser=userRep.findByUserId(currentUserId).orElseThrow(()->new RuntimeException("User is not authenticated"));
//        Here we are checking the message is valid and user is allowed to react and then fetching messageEn
        MessageEn messageEn=validateMessageAndReactionPermission(reactionReqDto.getMessageId(),currentUserId);
        if(messageEn==null)throw new RuntimeException("Message not found or user is not allowed to react");
//        Here we are validating that message is not deleted
        validateMessageNotDeletedOrCleared(messageEn,currentUserId);
//        Here we are validating that message is blocked and current user is sender or not
        validateBlockedMessageReactionPermission(messageEn,currentUserId);
//        Now checking the already exits reaction or not
        Optional<MessageReactionEn> messageReaction=reactionRepo.findByMessageEn_IdAndUser_UserId(messageEn.getId(),currentUserId);
        MessageReactionResponseDto reactionResponseDto=MessageReactionResponseDto.builder()
                .emoji(reactionReqDto.getEmoji())
                .messageId(reactionReqDto.getMessageId())
                .userId(currentUserId)
                .conversationId(messageEn.getConversation().getId())
                .build();
        if(messageReaction.isEmpty()){
            MessageReactionEn newReactionEn=createReaction(messageEn,currentUser,reactionReqDto);
            reactionResponseDto.setAction(ReactionActionEnum.ADDED);
            applicationEventPublisher.publishEvent(new ReactionEvent(reactionResponseDto,currentUserId));
            return ResponseEntity.ok(reactionResponseDto);
        }

        updateMessageReaction(messageReaction.get(),reactionReqDto);
        reactionResponseDto.setAction(ReactionActionEnum.UPDATED);
        applicationEventPublisher.publishEvent(new ReactionEvent(reactionResponseDto,currentUserId));
        return ResponseEntity.ok(reactionResponseDto);
    }

    //    This method will check the message is valid and if valid then weather the given user is allowed to react on that message or not
    private MessageEn validateMessageAndReactionPermission(Long messageId, String currUserId) {
        if (messageId == null || messageId <= 0) throw new RuntimeException("Validation request is not valid");
        return messageRepo.findMessageForReaction(
                currUserId,
                messageId
        ).orElseThrow(
                () -> new RuntimeException(
                        "Message not found or you are not allowed to react on this message"
                )
        );
    }

    //    This is used to check the weather the message is deleted from everyone
//    OR deleted from current user it could be even on delete from me or deleted in clear chat
//    Throw exception if not passed
    private void validateMessageNotDeletedOrCleared(
            MessageEn messageEn,
            String currentUserId
    ) {
//        if (messageEn == null) {
//            throw new RuntimeException("Message validation request is not valid");
//        }

        // Deleted for everyone
        if (messageEn.isDeletedForEveryOne()) {
            throw new RuntimeException(
                    "Not allowed to react to a message deleted for everyone"
            );
        }

        MessageReactionVisibilityProjection visibility =
                messageVisibilityRepo.findReactionVisibility(
                        messageEn.getId(),
                        currentUserId
                );

        // Deleted only for current user
        if (visibility.isDeletedForMe()) {
            throw new RuntimeException(
                    "Not allowed to react to a message deleted by you"
            );
        }

        // Message was removed because the conversation was cleared
        if (visibility.isClearedFromConversation()) {
            throw new RuntimeException(
                    "Not allowed to react to a message from cleared conversation"
            );
        }
    }

    //    This service is used to check that weather the current message status is blocked
    //    IF status is blocked then only the sender is able to react on message
    private void validateBlockedMessageReactionPermission(
            MessageEn messageEn,
            String currentUserId
    ) {
        if (messageEn == null) {
            throw new RuntimeException("Message validation request is not valid");
        }

        boolean reactionBlocked =
                messageDeliveryRepo.isReactionBlocked(
                        messageEn.getId(),
                        currentUserId
                );

        if (reactionBlocked) {
            throw new RuntimeException(
                    "Only the sender can react to a blocked message"
            );
        }
    }
    private MessageReactionEn createReaction(MessageEn messageEn,UserEn userEn,MessageReactionReqDto reactionReqDto){
//        if(messageEn==null || userEn==null || reactionReqDto==null)throw new RuntimeException("Creation request is not valid");
        MessageReactionEn reactionEn=MessageReactionEn.builder()
                .user(userEn)
                .messageEn(messageEn)
                .emoji(reactionReqDto.getEmoji())
                .build();
        MessageReactionEn savedEn;
        savedEn = reactionRepo.save(reactionEn);
        return savedEn;

    }
    private void updateMessageReaction(MessageReactionEn reactionEn,MessageReactionReqDto reactionReqDto){
        if(reactionEn.getEmoji().equals(reactionReqDto.getEmoji())){
            return;
        }
        reactionEn.setEmoji(reactionReqDto.getEmoji());
        reactionRepo.save(reactionEn);
    }
    @Transactional
    public ResponseEntity<?> deleteReaction(Long messageId){
        if(messageId==null || messageId<=0)return ResponseEntity.badRequest().body("Message id is not valid");
        String currentUserId= currentUserSer.getUserId();
        if(currentUserId==null || currentUserId.isEmpty())throw new RuntimeException("USer is not verified");
        MessageEn messageEn=validateMessageAndReactionPermission(messageId,currentUserId);
        if(messageEn==null)throw new RuntimeException("Message not found or user is not allowed to react");
//        Here we are validating that message is not deleted
        validateMessageNotDeletedOrCleared(messageEn,currentUserId);
//        Here we are validating that message is blocked and current user is sender or not
        validateBlockedMessageReactionPermission(messageEn,currentUserId);
//        Now checking the already exits reaction or not
        Optional<MessageReactionEn> messageReaction=reactionRepo.findByMessageEn_IdAndUser_UserId(messageEn.getId(),currentUserId);
        if(messageReaction.isEmpty()) {
            return ResponseEntity.badRequest().body("Reaction not found for the given message");
        }reactionRepo.delete(messageReaction.get());
        MessageReactionResponseDto reactionResponseDto=MessageReactionResponseDto.builder()
                .emoji(null)
                .messageId(messageId)
                .action(ReactionActionEnum.DELETED)
                .userId(currentUserId)
                .conversationId(messageEn.getConversation().getId())
                .build();
        applicationEventPublisher.publishEvent(new ReactionEvent(reactionResponseDto,currentUserId));
        return ResponseEntity.ok(reactionResponseDto);
    }
}
