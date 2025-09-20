package com.project.warehouse_management_system.WareHouseStructure.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.WareHouseStructure.model.Position;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepo extends BaseRepo<Position,Long> {
    @Query("SELECT p FROM Position p WHERE p.isEmpty = true ORDER BY p.id")
    List<Position> findByIsEmptyTrue();

    @Query("SELECT p FROM Position p WHERE p.isNew = true ORDER BY p.id")
    List<Position> findByIsNewTrue();
}
