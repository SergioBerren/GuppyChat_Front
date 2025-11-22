package com.guppychat.service;

import com.guppychat.model.Chat;
import com.guppychat.repository.ChatRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatServicio {

    @Autowired
    private ChatRepositorio chatRepositorio;

    public List<Chat> obtenerChatsDeUsuario(String usuarioId) {
        return chatRepositorio.findByEmisorIdOrReceptorId(usuarioId, usuarioId);
    }
}
