package com.shiv.chat_bakend.model;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name="message_delivery",
        indexes = {

                @Index(
                        name="idx_delivery_message",
                        columnList="message_id"
                ),

                @Index(
                        name="idx_delivery_user",
                        columnList="user_id"
                )
        }
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageDeliveryEn {


    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="message_id",
            nullable=false
    )
    private MessageEn message;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="user_id",
            nullable=false
    )
    private UserEn user;


    @Enumerated(EnumType.STRING)
    private MessageStatusEnum status;


    private LocalDateTime deliveredAt;


    private LocalDateTime readAt;
}
