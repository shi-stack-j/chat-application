package com.shiv.chat_bakend.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_message_reaction_user",
                        columnNames = {"message_id", "user_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_reaction_message",
                        columnList = "message_id"
                ),
                @Index(
                        name = "idx_reaction_user",
                        columnList = "user_id"
                )
        }
)
public class MessageReactionEn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY , optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private UserEn user;

    @ManyToOne(fetch = FetchType.LAZY , optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private MessageEn messageEn;

    @NotBlank
    @Size(max = 32)
    @Column(
            name = "emoji",
            nullable = false,
            length = 32
    )
    private String emoji;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
