package com.shiv.chat_bakend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
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
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
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



    @CreationTimestamp
    private LocalDateTime sentAt;

    @CreationTimestamp
    private LocalDateTime createdAt;


}