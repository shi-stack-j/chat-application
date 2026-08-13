package com.shiv.chat_bakend.projection;


public interface MessageReactionProjection {
    Long getMessageId();
    String getUserId();
    String getEmoji();
}
