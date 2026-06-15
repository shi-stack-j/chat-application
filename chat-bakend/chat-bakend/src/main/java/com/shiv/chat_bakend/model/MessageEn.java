package com.shiv.chat_bakend.model;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name="messages",
        indexes = {

                @Index(
                        name="idx_message_conversation",
                        columnList="conversation_id"
                ),

                @Index(
                        name="idx_message_created",
                        columnList="created_at"
                )
        }
)
public class MessageEn{


    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="conversation_id",
            nullable=false
    )
    private ConversationEn conversation;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="sender_id",
            nullable=false
    )
    private UserEn sender;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="receiver_id",
            nullable=false
    )
    private UserEn receiver;



    @Column(
            nullable=false,
            columnDefinition="TEXT"
    )
    private String content;



    @Enumerated(EnumType.STRING)
    private MessageStatusEnum status;



    @CreationTimestamp
    private LocalDateTime sentAt;



    private LocalDateTime deliveredAt;



    private LocalDateTime readAt;

}