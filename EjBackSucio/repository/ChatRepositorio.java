package com.guppychat.repository;

import com.guppychat.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatRepositorio extends JpaRepository<Chat, Long> {
    List<Chat> findByEmisorIdOrReceptorId(String emisorId, String receptorId);
}
