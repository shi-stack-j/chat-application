package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.OnlinePresenceEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnlinePresenceRepo extends JpaRepository<OnlinePresenceEn,Long> {
    Optional<OnlinePresenceEn> findByUser_id(String user);
}
