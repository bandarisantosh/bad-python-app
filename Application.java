package com.ssrf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;

@ServletComponentScan
@SpringBootApplication
public class SSRFApplication {
	public static void main(String[] args) {
		Postgres.setup();
		SpringApplication.run(SSRFApplication.class, args);
	}
}