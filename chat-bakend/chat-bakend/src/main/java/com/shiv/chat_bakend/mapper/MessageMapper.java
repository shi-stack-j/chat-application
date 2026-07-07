package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.dto.message.MessageResDto;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;

public class MessageMapper {
    public static MessageEn toMessageEn(MessageReqDto messageReqDto, UserEn sender, UserEn receiver, ConversationEn conversationEn){
        MessageEn messageEn=new MessageEn();
        messageEn.setContent(messageReqDto.getContent());
        messageEn.setSender(sender);
        messageEn.setReceiver(receiver);
        messageEn.setConversation(conversationEn);
        return messageEn;
    }

    public static MessageResDto toMessageResDto(MessageEn messageEn){
        MessageResDto messageResDto=new MessageResDto();
        messageResDto.setConversationId(messageEn.getConversation().getId());
        messageResDto.setContent(messageEn.getContent());
        messageResDto.setSenderId(messageEn.getSender().getUserId());
        messageResDto.setReceivedAt(messageEn.getSentAt());
        return messageResDto;
    }
}
