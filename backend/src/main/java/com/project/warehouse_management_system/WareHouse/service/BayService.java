package com.project.warehouse_management_system.WareHouse.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.WareHouse.model.Bay;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BayService extends BaseService<Bay,Long> {
    @Override
    protected void setEntityId(Bay entity, Long id) {
        entity.setId(id);
    }
}
