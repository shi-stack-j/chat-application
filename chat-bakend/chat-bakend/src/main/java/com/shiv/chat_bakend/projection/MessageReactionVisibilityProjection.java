package com.shiv.chat_bakend.projection;


public interface MessageReactionVisibilityProjection {

    boolean isDeletedForMe();

    boolean isClearedFromConversation();
}
