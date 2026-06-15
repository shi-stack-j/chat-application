package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.UserEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRep extends JpaRepository<UserEn,Long> {

//    This is used to fetch the userBy id
    Optional<UserEn> findByUserId(String userId);
//    This method is used to fetch the User by id and only the user who's active status is true
    Optional<UserEn> findByUserIdAndIsActiveTrue(String userId);
//    To check that weather the user exists by the userId
    boolean existsByUserId(String userId);

}
