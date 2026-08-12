package com.shiv.chat_bakend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_blocks",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_blocker_blocked",
                        columnNames = {"blocker_id", "blocked_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_blocker",
                        columnList = "blocker_id"
                ),
                @Index(
                        name = "idx_blocked",
                        columnList = "blocked_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlockEn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    That user that is blocking the another user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "blocker_id",
            nullable = false
    )
    private UserEn blocker;

//    The user that is getting blocked
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "blocked_id",
            nullable = false
    )
    private UserEn blocked;

    @CreationTimestamp
    private LocalDateTime blockedAt;
}

