package com.guppychat.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String emisorId;
    private String receptorId;
    private String mensajeCifrado;
    private LocalDateTime fechaHora = LocalDateTime.now();
}
