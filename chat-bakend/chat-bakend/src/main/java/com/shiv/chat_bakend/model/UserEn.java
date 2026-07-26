package com.shiv.chat_bakend.model;



import com.shiv.chat_bakend.enums.RoleEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class UserEn {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    @Size(min = 3 , message = "Size must be greater then 3 ")
    private String userId;
    @Column(nullable = false)
    private String nickName;
    @Column(nullable = false)
    @NotBlank(message = "Password is required")
    private String password;
    private String avatarUrl;
    private boolean isActive=true;
    private boolean deleted=false;
    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deactivatedOn;
    private LocalDateTime deletedOn;

    @Enumerated(EnumType.STRING)
    private RoleEnum role;
}
