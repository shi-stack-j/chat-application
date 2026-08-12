package com.shiv.chat_bakend.projection;

public interface UserBlockProjection {
    boolean isAnyBlock();
    boolean isCurrentUserBlocker();
}