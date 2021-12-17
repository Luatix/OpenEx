package io.openex.config;

import org.jetbrains.annotations.NotNull;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.AbstractResourceResolver;
import org.springframework.web.servlet.resource.EncodedResourceResolver;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

import javax.servlet.http.HttpServletRequest;
import java.util.List;


class ReactIndexResourceResolver extends AbstractResourceResolver {

    @Override
    protected Resource resolveResourceInternal(HttpServletRequest request, @NotNull String requestPath,
                                               @NotNull List<? extends Resource> locations,
                                               @NotNull ResourceResolverChain chain) {
        return new ClassPathResource("/build/index.html");
    }

    @Override
    protected String resolveUrlPathInternal(@NotNull String resourceUrlPath,
                                            @NotNull List<? extends Resource> locations,
                                            @NotNull ResourceResolverChain chain) {
        return chain.resolveUrlPath(resourceUrlPath, locations);
    }
}

@Component
@EnableWebMvc
public class MvcConfig implements WebMvcConfigurer {

    private final static int CACHE_PERIOD = 3600;

    private void addPathStaticResolver(ResourceHandlerRegistry registry, String pattern, String location) {
        registry
                .addResourceHandler(pattern)
                .addResourceLocations(location)
                .setCachePeriod(CACHE_PERIOD)
                .resourceChain(true)
                .addResolver(new EncodedResourceResolver())
                .addResolver(new PathResourceResolver());
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Specific case of react index
        registry.addResourceHandler("/", "/private", "/private/**")
                .addResourceLocations("classpath:/build/")
                .setCachePeriod(CACHE_PERIOD)
                .resourceChain(true)
                .addResolver(new EncodedResourceResolver())
                .addResolver(new ReactIndexResourceResolver());
        // React statics
        addPathStaticResolver(registry, "/static/**", "classpath:/build/static/");
        // Specific application images
        addPathStaticResolver(registry, "/images/**", "classpath:/build/images/");
        // Ckeditor statics
        addPathStaticResolver(registry, "/ckeditor/**", "classpath:/build/ckeditor/");
    }
}