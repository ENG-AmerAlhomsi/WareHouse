package com.project.warehouse_management_system.BaseClasses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public abstract class BaseService<T, ID> {

    @Autowired
    private BaseRepo<T, ID> baseRepo;


    public List<T> getAll() {
        return baseRepo.findAll();
    }

    public T getById(ID id) {
        Optional<T> entity = baseRepo.findById(id);
        return entity.orElseThrow(() -> new RuntimeException("Entity not found"));
    }

    public T create(T entity) {
        return baseRepo.save(entity);
    }

    @Transactional
    public List<T> createList(List<T> entity) {
        return baseRepo.saveAll(entity);
    }

    public T update(ID id, T entity) {
        if (!baseRepo.existsById(id)) {
            throw new RuntimeException("Entity not found");
        }
        setEntityId(entity,id);
        return baseRepo.save(entity);
    }

    public void delete(ID id) {
        if (!baseRepo.existsById(id)) {
            throw new RuntimeException("Entity not found");
        }
        baseRepo.deleteById(id);
    }

    protected abstract void setEntityId(T entity, ID id);


}
