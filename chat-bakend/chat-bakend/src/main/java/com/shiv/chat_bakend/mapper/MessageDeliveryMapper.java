package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import com.shiv.chat_bakend.model.MessageEn;

public class MessageDeliveryMapper {
    public static MessageDeliveryEn toMessageDeliveryEn(MessageEn messageEn){
        MessageDeliveryEn messageDeliveryEn=new MessageDeliveryEn();
        messageDeliveryEn.setMessage(messageEn);
        messageDeliveryEn.setStatus(MessageStatusEnum.SENT);
        messageDeliveryEn.setUser(messageEn.getReceiver());
        return messageDeliveryEn;
    }
}
