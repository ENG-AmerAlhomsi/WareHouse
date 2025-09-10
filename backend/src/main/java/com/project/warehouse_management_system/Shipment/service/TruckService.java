package com.project.warehouse_management_system.Shipment.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.Shipment.model.Truck;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TruckService extends BaseService<Truck,Long> {
    @Override
    protected void setEntityId(Truck entity, Long id) {
        entity.setId(id);
    }
}
