package com.project.warehouse_management_system.Shipment.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Shipment.model.Shipment;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepo extends BaseRepo<Shipment,Long> {
    @Query("SELECT s FROM Shipment s WHERE s.shippingEmployee = :userId ORDER BY s.id DESC")
    List<Shipment> findByShippingEmployee(@Param("userId") String userId);
}
