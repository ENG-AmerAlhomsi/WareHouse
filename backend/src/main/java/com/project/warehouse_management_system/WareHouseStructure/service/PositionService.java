package com.project.warehouse_management_system.WareHouseStructure.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.WareHouseStructure.model.Position;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PositionService extends BaseService<Position,Long> {
    @Override
    protected void setEntityId(Position entity, Long id) {
        entity.setId(id);
    }
}
