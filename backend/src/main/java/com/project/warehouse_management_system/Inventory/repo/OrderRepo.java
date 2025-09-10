package com.project.warehouse_management_system.Inventory.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Inventory.model.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepo extends BaseRepo<Orders,Long> {
    @Query("SELECT o FROM Orders o WHERE o.userId = :userId ORDER BY o.date DESC")
    List<Orders> findByUserId(@Param("userId") String userId);
    
    @Query("SELECT o FROM Orders o WHERE o.userId = :userId ORDER BY o.date DESC")
    Page<Orders> findByUserIdPaginated(@Param("userId") String userId, Pageable pageable);
}
