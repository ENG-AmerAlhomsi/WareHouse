package com.project.warehouse_management_system.BaseClasses;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@SecurityRequirement(name = "Keycloak")
public abstract class BaseController<T, ID> {

    @Autowired
    private BaseService<T, ID> baseService;

    @GetMapping("/get")
    public ResponseEntity<List<T>> getAll() {
        List<T> getAll = baseService.getAll();
        return new ResponseEntity<>(getAll, HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<T> getById(@PathVariable ID id) {
        T getById = baseService.getById(id);
        return new ResponseEntity<>(getById, HttpStatus.OK);
    }

    @PostMapping("/create")
    public ResponseEntity<T> createNew(@RequestBody T entity) {
        T created = baseService.create(entity);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/createlist")
    public ResponseEntity<List<T>> createNewList(@RequestBody List<T> entity) {
       List <T> createdList = baseService.createList(entity);
        return new ResponseEntity<>(createdList, HttpStatus.CREATED);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<T> update(@PathVariable ID id, @RequestBody T entity) {
        T updated = baseService.update(id, entity);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable ID id) {
        baseService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}