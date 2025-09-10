package com.project.warehouse_management_system.Shipment.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Shipment.model.Truck;
import org.springframework.stereotype.Repository;

@Repository
public interface TruckRepo extends BaseRepo<Truck,Long> {
}
