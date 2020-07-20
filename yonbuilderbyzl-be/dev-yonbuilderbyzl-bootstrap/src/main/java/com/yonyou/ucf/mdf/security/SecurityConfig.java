package com.yonyou.ucf.mdf.security;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.firewall.DefaultHttpFirewall;
import org.springframework.security.web.firewall.HttpFirewall;


@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    /**
     * 密码加密 配置PasswordEncoder
     */
    public static final PasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Value("${management.endpoints.web.base-path}")
    private String actuatorBasePath = "";

    /**
     * 配置固定的内存级用户
     * @param auth
     * @throws Exception
     */
    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        //auth.userDetailsService(xxx); // 自定义查询用户的接入口； 需要实现 UserDetailsService 接口
        auth.inMemoryAuthentication()
                .passwordEncoder(ENCODER)
                .withUser("user").password(ENCODER.encode("123456")).roles("USER")
                .and().withUser("admin").password(ENCODER.encode("123456")).roles("USER", "ADMIN")
                .and().withUser("superman").password(ENCODER.encode("123456")).roles("USER", "ADMIN","SUPERADMIN");
    }

    @Bean
    public HttpFirewall allowUrlEncodedSlashHttpFirewall() {
        DefaultHttpFirewall firewall = new DefaultHttpFirewall(); //new StrictHttpFirewall();
        firewall.setAllowUrlEncodedSlash(true);
        return firewall;
    }

    /**
     * 忽略静态资源
     */
    @Override
    public void configure(WebSecurity web) throws Exception {
        /*
         * 在springboot中忽略静态文件路径，直接写静态文件的文件夹
         * springboot默认有静态文件的放置路径，如果应用spring security，配置忽略路径
         * 不应该从springboot默认的静态文件开始
         * 如：在本项目中，所有的js和css都放在static下，如果配置忽略路径，则不能以static开始
         * 配置成web.ignoring().antMatchers("/static/*");这样是不起作用的,如果忽略静态资源，页面样式可能无法加载
         * //web.ignoring().antMatchers("/themes/**","/script/**");
         */
        web.httpFirewall(allowUrlEncodedSlashHttpFirewall());
        //super.configure(web);
    }

    /**
     * configure(HttpSecurity)方法定义了哪些URL路径应该被保护
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.formLogin()                    //  定义当需要用户登录时候，转到的登录页面。
                .and()
                .authorizeRequests()        // 定义哪些URL需要被保护、哪些不需要被保护
                .antMatchers("/actuator/health").permitAll()
                .antMatchers("/actuator/info").permitAll()
                .antMatchers("/actuator/**").hasAnyRole("ADMIN","SUPERADMIN")
                .antMatchers(actuatorBasePath+"/health").permitAll()
                .antMatchers(actuatorBasePath+"/info").permitAll()
                .antMatchers(actuatorBasePath+"/**").hasAnyRole("ADMIN","SUPERADMIN")
                .antMatchers("/bpm/**").permitAll()
                .antMatchers("/pub/rest/**").permitAll()
                .anyRequest()
                .permitAll().and().csrf().disable();// .authenticated(); //任何请求,登录后可以访问
//

        /** 自定义 登陆页等的配置 */
//            http.authorizeRequests()// 该方法所返回的对象的方法来配置请求级别的安全细节
//                .antMatchers("/login").permitAll()// 登录页面不拦截
//                .antMatchers(HttpMethod.POST, "/checkLogin").permitAll().anyRequest().authenticated()// 对于登录路径不进行拦截
//                .and().formLogin()// 配置登录页面
//                .loginPage("/login")// 登录页面的访问路径;
//                .loginProcessingUrl("/checkLogin")// 登录页面下表单提交的路径
//                .failureUrl("/login?paramserror=true")// 登录失败后跳转的路径,为了给客户端提示
//                .defaultSuccessUrl("/index")// 登录成功后默认跳转的路径;
//                .and().logout()// 用户退出操作
//                .logoutUrl("/logout")// 用户退出所访问的路径，需要使用Post方式
//                .permitAll().logoutSuccessUrl("/login?logout=true")// 退出成功所访问的路径
//                .and().csrf().disable(); //关闭打开的csrf保护
    }


}
