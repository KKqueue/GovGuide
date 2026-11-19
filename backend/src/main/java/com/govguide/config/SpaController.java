package com.govguide.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@ConditionalOnProperty(name = "app.frontend.dir")
public class SpaController {

    @GetMapping(value = {"/", "/{path:[^\\.]*}", "/{path:[^\\.]*}/{sub:[^\\.]*}", "/{path:[^\\.]*}/{sub:[^\\.]*}/{rest:[^\\.]*}"})
    public String forward() {
        return "forward:/index.html";
    }
}
