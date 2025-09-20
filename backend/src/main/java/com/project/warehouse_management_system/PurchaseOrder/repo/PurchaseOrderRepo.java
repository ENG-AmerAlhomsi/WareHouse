package com.project.warehouse_management_system.PurchaseOrder.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.PurchaseOrder.model.PurchaseOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepo extends BaseRepo<PurchaseOrder, Long> {
    // Optimized queries with @Query annotation
    @Query("SELECT po FROM PurchaseOrder po WHERE po.status = :status ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByStatus(@Param("status") String status);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.userId = :userId ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByUserId(@Param("userId") String userId);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.userId = :userId AND po.status = :status ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") String status);

    // Custom method with optimized query
    @Query("SELECT po FROM PurchaseOrder po WHERE po.id = :id")
    PurchaseOrder getPurchaseOrderById(@Param("id") Long id);
}
