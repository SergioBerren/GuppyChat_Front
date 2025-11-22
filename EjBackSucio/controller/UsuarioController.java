package com.guppychat.controller;

import com.guppychat.model.Usuario;
import com.guppychat.service.UsuarioServicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioServicio usuarioServicio;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioServicio.listar();
    }

    @PostMapping
    public Usuario registrarUsuario(@RequestBody Usuario usuario) {
        return usuarioServicio.registrar(usuario);
    }

    @GetMapping("/{nombreUsuario}")
    public Usuario obtenerUsuario(@PathVariable String nombreUsuario) {
        return usuarioServicio.obtenerPorNombre(nombreUsuario);
    }
}
