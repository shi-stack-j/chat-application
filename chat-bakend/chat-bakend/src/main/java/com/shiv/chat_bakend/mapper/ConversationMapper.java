package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.dto.conversation.ConversationDto;
import com.shiv.chat_bakend.dto.conversation.ConversationSummaryResDto;
import com.shiv.chat_bakend.dto.user.UserResDto;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.UserEn;

import java.time.LocalDateTime;

public class ConversationMapper {
    public static ConversationDto toConversationDto(ConversationEn conversationEn){
        ConversationDto conversationDto = new ConversationDto();
        conversationDto.setConversationId(conversationEn.getId());
        conversationDto.setUser_one(conversationEn.getUserOne().getUserId());
        conversationDto.setUser_two(conversationEn.getUserTwo().getUserId());
        conversationDto.setLastMessage(conversationEn.getLastMessageAt());
        return conversationDto;
    }

    public static ConversationEn toConversationEntity(UserEn userOne,UserEn userTwo){
        ConversationEn conversationEn=new ConversationEn();
        conversationEn.setUserOne(userOne);
        conversationEn.setUserTwo(userTwo);
        conversationEn.setLastMessageAt(LocalDateTime.now());
        return conversationEn;
    }

    public static ConversationSummaryResDto toConversationResSummary(ConversationEn conversationEn, UserResDto userResDto, String lastMessage, Long unreadMessage){
        ConversationSummaryResDto conversationSummaryResDto=new ConversationSummaryResDto();
        conversationSummaryResDto.setConversationId(conversationEn.getId());
        conversationSummaryResDto.setReceiver(userResDto);
        conversationSummaryResDto.setLastMessage(lastMessage);
        conversationSummaryResDto.setLastMessageTime(conversationEn.getLastMessageAt());
        conversationSummaryResDto.setUnreadCount(unreadMessage);
        return conversationSummaryResDto;
    }
}
