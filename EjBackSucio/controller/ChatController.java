package com.guppychat.controller;

import com.guppychat.model.Chat;
import com.guppychat.repository.ChatRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate plantillaMensajes;

    @Autowired
    private ChatRepositorio chatRepositorio;

    @MessageMapping("/chat.enviar")
    public void enviar(Chat chat) {
        // Guardamos el mensaje cifrado
        chatRepositorio.save(chat);

        // Enviamos al receptor (ruta específica)
        plantillaMensajes.convertAndSend("/tema/" + chat.getReceptorId(), chat);
    }
}
