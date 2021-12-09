package com.example.server.service.implementation;

import com.example.server.enums.Status;
import com.example.server.model.Server;
import com.example.server.repository.ServerRepository;
import com.example.server.service.IServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.transaction.Transactional;
import java.io.IOException;
import java.net.InetAddress;
import java.util.Collection;
import java.util.Random;

import static java.util.List.of;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class ServerService implements IServerService {

    private final ServerRepository serverRepository;

    @Override
    public Server create(Server server) {
        log.info("Saving new server: {}", server.getName());
        server.setImageUrl(generateServerImage());
        return this.serverRepository.save(server);
    }

    @Override
    public Server ping(String ipAddress) throws IOException {
        log.info("Pinging server IP: {}", ipAddress);
        Server server = serverRepository.findByIpAddress(ipAddress);
        InetAddress address = InetAddress.getByName(ipAddress);
        server.setStatus(address.isReachable(10000) ? Status.SERVER_UP : Status.SERVER_DOWN);
        serverRepository.save(server);
        return server;
    }

    @Override
    public Collection<Server> list(int limit) {
        log.info("Fetching all servers");
        return serverRepository.findAll(Pageable.ofSize(limit)).stream().toList();
    }

    @Override
    public Server get(Long id) {
        log.info("Fetching server by id: {}", id);
        return serverRepository.findById(id).get();
    }

    @Override
    public Server update(Server server) {
        log.info("Updating server: {}", server.getName());
        return this.serverRepository.save(server);
    }

    @Override
    public boolean delete(Long id) {
        log.info("Deleting server: {}", id);
        this.serverRepository.deleteById(id);
        return true;
    }

    private String generateServerImage() {
        String[] imagesNames = {"1.png", "2.png", "3.png"};
        return ServletUriComponentsBuilder.fromCurrentContextPath().path("/server/image/" +
                imagesNames[new Random().nextInt(3)]).toUriString();
    }
}
