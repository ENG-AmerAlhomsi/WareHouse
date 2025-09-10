package com.project.warehouse_management_system.WareHouse.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.WareHouse.model.Area;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AreaService extends BaseService<Area,Long> {
    @Override
    protected void setEntityId(Area entity, Long id) {
        entity.setId(id);
    }
}
