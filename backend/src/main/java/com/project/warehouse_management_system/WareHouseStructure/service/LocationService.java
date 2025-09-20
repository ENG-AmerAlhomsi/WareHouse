package com.project.warehouse_management_system.WareHouseStructure.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.WareHouseStructure.model.Location;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LocationService extends BaseService<Location,Long> {
    @Override
    protected void setEntityId(Location entity, Long id) {
        entity.setId(id);
    }
}
