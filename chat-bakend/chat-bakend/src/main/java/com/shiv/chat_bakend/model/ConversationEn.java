package com.shiv.chat_bakend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        indexes = {
                @Index(
                        name="idx_conversation_users",
                        columnList="user_one_id,user_two_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"user_one_id", "user_two_id"}
                )
        }
)
public class ConversationEn {


    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="user_one_id",
            nullable=false
    )
    private UserEn userOne;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name="user_two_id",
            nullable=false
    )
    private UserEn userTwo;



    @CreationTimestamp
    private LocalDateTime createdAt;



    @UpdateTimestamp
    private LocalDateTime updatedAt;



    // optional
    private boolean active=true;

//    This is used when message is sent on the entity
    private LocalDateTime lastMessageAt;

}
